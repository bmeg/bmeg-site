---
title: Sample Counts
weight: 40
authors:
- kellrott
- adamstruck
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Use aggregation methods to count number of samples in a program
---

```python
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Count number of Projects per Program


```python
q = G.query().V().hasLabel("Program").as_("p").out("projects").select("p")
q = q.aggregate(gripql.term("project_count", "$._id"))
for row in q.execute()[0]["project_count"]["buckets"]:
    print("%s\t%s" % (row["key"], row["value"]))
```

    [INFO]	2020-01-14 14:25:03,363	1 results received in 0 seconds


    Program:TCGA	33
    Program:GTEx	31
    Program:CCLE	1
    Program:GDSC	1
    Program:CTRP	1


Count number of Cases per Program


```python
q = G.query().V().hasLabel("Program").as_("p").out("projects").out("cases").select("p")
q = q.aggregate(gripql.term("sample_count", "$._id"))
for row in q.execute()[0]["sample_count"]["buckets"]:
    print("%s\t%s" % (row["key"], row["value"]))
```

    [INFO]	2020-01-14 14:25:23,826	1 results received in 1 seconds


    Program:TCGA	11315
    Program:GTEx	8859
    Program:CCLE	1618
    Program:GDSC	1075
    Program:CTRP	887


Count number of Samples per Program


```python
q = G.query().V().hasLabel("Program").as_("p").out("projects").out("cases").out("samples").select("p")
q = q.aggregate(gripql.term("sample_count", "$._id"))
for row in q.execute()[0]["sample_count"]["buckets"]:
    print("%s\t%s" % (row["key"], row["value"]))
```

    [INFO]	2020-01-14 14:26:37,527	1 results received in 13 seconds


    Program:GTEx	204512
    Program:TCGA	33405
    Program:CCLE	1618
    Program:GDSC	1075
    Program:CTRP	887



```python

```
