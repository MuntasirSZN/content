import type { ZodType } from 'zod/v4'
import type { $ZodOptionalDef } from 'zod/v4/core'
import { z as zod } from 'zod/v4'
import type { Draft07, EditorOptions } from '../types'

declare module 'zod/v4' {
  interface ZodTypeDef {
    editor?: EditorOptions
  }

  interface ZodType {
    editor(options: EditorOptions): this
  }
}

export type ZodFieldType = 'ZodString' | 'ZodNumber' | 'ZodBoolean' | 'ZodDate' | 'ZodEnum'
export type SqlFieldType = 'VARCHAR' | 'INT' | 'BOOLEAN' | 'DATE' | 'TEXT'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(zod.ZodType as any).prototype.editor = function (options: EditorOptions) {
  this._def.editor = { ...this._def.editor, ...options }
  return this
}

export const z = zod

// Function to get the underlying Zod type
export function getUnderlyingType(zodType: ZodType): ZodType {
  while ((zodType._def as $ZodOptionalDef).innerType) {
    zodType = (zodType._def as $ZodOptionalDef).innerType as ZodType
  }
  return zodType
}

export function getUnderlyingTypeName(zodType: ZodType): string {
  return getUnderlyingType(zodType).constructor.name
}

// Helper function to convert Zod JSONSchema properties to Draft07 format
function convertProperties(props: Record<string, any> | undefined): Record<string, any> {
  if (!props) return {}
  
  const converted: Record<string, any> = {}
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'object' && value !== null) {
      converted[key] = {
        ...value,
        properties: value.properties ? convertProperties(value.properties) : undefined
      }
    } else {
      converted[key] = value
    }
  }
  return converted
}

export function zodToStandardSchema(schema: zod.ZodSchema, _name: string): Draft07 {
  // Use Zod v4's native JSON schema generation with proper date handling
  try {
    const baseSchema = zod.toJSONSchema(schema, {
      target: 'draft-7',
      unrepresentable: 'any',
      override: (ctx) => {
        // Handle ZodDate specifically to convert to string with date-time format
        if (ctx.zodSchema._zod?.def.typeName === 'ZodDate') {
          ctx.jsonSchema.type = 'string'
          ctx.jsonSchema.format = 'date-time'
        }
      }
    })

    // Convert Zod's JSONSchema format to our Draft07 format
    const draft07Schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/default',
      definitions: {
        default: {
          type: baseSchema.type as string || 'object',
          properties: convertProperties(baseSchema.properties),
          required: Array.isArray(baseSchema.required) ? baseSchema.required : [],
          additionalProperties: typeof baseSchema.additionalProperties === 'boolean' ? baseSchema.additionalProperties : false
        }
      }
    }

    return draft07Schema
  } catch (error) {
    console.error('Zod toJSONSchema error for schema:', schema.constructor.name, error)
    // Fallback to a basic empty schema if conversion fails
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/default',
      definitions: {
        default: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: false
        }
      }
    }
  }
}
