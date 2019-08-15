---
title: Sample Counts
weight: 40
authors:
- kellrott
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2018-05-09
tldr: Use aggregation methods to count number of samples in a program
---

```python
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
O = conn.graph("bmeg_rc2")
```

Count number of Projects per Program


```python
q = O.query().V().hasLabel("Program").as_("p").out("projects").select("p")
q = q.aggregate(gripql.term("project_count", "$._gid"))
for row in q.execute()[0]["project_count"]["buckets"]:
    print("%s\t%s" % (row["key"], row["value"]))
```

    [INFO]	2019-07-26 18:01:50,332	1 results received in 0 seconds


    Program:CCLE	37
    Program:TCGA	33
    Program:GTEx	31
    Program:GDSC	31
    Program:CTRP	30
    Program:TARGET	7
    Program:CPTAC	1
    Program:FM	1
    Program:NCICCR	1
    Program:CTSP	1
    Program:HCMI	1
    Program:BEATAML1.0	1
    Program:VAREPOP	1


Count number of Samples per Program


```python
q = O.query().V().hasLabel("Program").as_("p").out("projects").out("cases").select("p")
q = q.aggregate(gripql.term("sample_count", "$._gid"))
for row in q.execute()[0]["sample_count"]["buckets"]:
    print("%s\t%s" % (row["key"], row["value"]))
```

    [INFO]	2019-07-26 18:02:37,232	1 results received in 2 seconds


    Program:FM	18004
    Program:TCGA	11315
    Program:TARGET	3360
    Program:CCLE	1617
    Program:GDSC	1001
    Program:CTRP	886
    Program:GTEx	752
    Program:NCICCR	489
    Program:CPTAC	322
    Program:BEATAML1.0	56
    Program:CTSP	45
    Program:HCMI	7
    Program:VAREPOP	7

