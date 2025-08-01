import { describe, test, expect, assert } from 'vitest'
import csvToJson from 'csvtojson'
import * as z from 'zod/v4'
import { parseContent } from '../utils/content'
import { defineCollection } from '../../src/utils'
import { resolveCollection } from '../../src/utils/collection'

const csvs = `
a,b,c
1,2,3
4,5,6
---
first,last,address,city,zip
John,Doe,120 any st.,"Anytown, WW",08123
---
a,b,c
1,"",""
2,3,4
---
a,b,c
1,"",""
2,3,4
---
a,b
1,"ha ""ha"" ha"
3,4
---
key,val
1,"{""type"": ""Point"", ""coordinates"": [102.0, 0.5]}"
---
a,b,c
1,2,3
"Once upon 
a time",5,6
7,8,9
---
a,b,c
1,2,3
"Once upon 
a time",5,6
7,8,9
---
a,b
1,"ha 
""ha"" 
ha"
3,4
---
a,b,c
1,2,3
---
a,b,c
1,2,3
---
a,b,c
1,2,3
4,5,ʤ
---
John,Doe,120 jefferson st.,Riverside, NJ, 08075
Jack,McGinnis,220 hobo Av.,Phila, PA,09119
"John ""Da Man""",Repici,120 Jefferson St.,Riverside, NJ,08075
Stephen,Tyler,"7452 Terrace ""At the Plaza"" road",SomeTown,SD, 91234
,Blankman,,SomeTown, SD, 00298
"Joan ""the bone"", Anne",Jet,"9th, at Terrace plc",Desert City,CO,00123

`.trim().split('\n---\n')

describe('Parser (.csv)', () => {
  const collection = resolveCollection('content', defineCollection({
    type: 'data',
    source: 'content/**',
    schema: z.object({
      body: z.any(),
    }),
  }))!
  for (const csv of csvs) {
    test(`${csv.replace(/\n/g, '-')}`, async () => {
      const parsed = await parseContent('content/index.csv', csv, collection)

      expect(parsed).toHaveProperty('id')
      assert(parsed.id === 'content/index.csv')

      expect(parsed).toHaveProperty('body')
      expect(Array.isArray(parsed.body)).toBeTruthy()
      const truth = await csvToJson({ output: 'json' }).fromString(csv)

      expect(parsed.body).toMatchObject(truth)
    })
  }
})
