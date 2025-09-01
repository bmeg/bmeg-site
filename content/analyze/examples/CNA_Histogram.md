---
title: CNA Histogram
authors:
- kellrott
- adamstruck
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Build a histogram from the copy number alteration values for genes in a TCGA cohort
---

```python
import matplotlib.pyplot as plt
import numpy as np
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Get Ensembl Gene ids for genes of interest


```python
GENES = ["PTEN", "TP53", "RB1"]
gene_ids = {}
for g in GENES:
    for i in G.query().V().hasLabel("Gene").has(gripql.eq("symbol", g)):
        gene_ids[g] = i._id
```

    [INFO]	2020-01-14 13:44:13,074	1 results received in 0 seconds
    [INFO]	2020-01-14 13:44:13,241	1 results received in 0 seconds
    [INFO]	2020-01-14 13:44:13,426	1 results received in 0 seconds



```python
gene_ids
```




    {'PTEN': 'ENSG00000171862',
     'TP53': 'ENSG00000141510',
     'RB1': 'ENSG00000139687'}



For each gene of interest, obtain the copy number alteration values and aggregate them by gene.


```python
q = G.query().V("Project:TCGA-PRAD").out("cases").out("samples").out("aliquots")
q = q.has(gripql.eq("$.gdc_attributes.sample_type", 'Primary Tumor')).out("copy_number_alterations")
q = q.aggregate(
    list( gripql.term( g, "values.%s" % (g), 5) for g in gene_ids.values() )
)

res = list(q)
for r in res[0]:
    for b in res[0][r]['buckets']:
        print("%s\t%s:%s" % (r, b['key'], b['value']))
```

    [INFO]	2020-01-14 13:44:23,255	1 results received in 3 seconds


    ENSG00000139687	0:269
    ENSG00000139687	-1:139
    ENSG00000139687	-2:81
    ENSG00000139687	1:3
    ENSG00000141510	0:329
    ENSG00000141510	-1:126
    ENSG00000141510	-2:37
    ENSG00000171862	0:327
    ENSG00000171862	-2:95
    ENSG00000171862	-1:64
    ENSG00000171862	1:5
    ENSG00000171862	2:1


Create a barchart showing the counts of copy number altered samples in the cohort.


```python
val = []
count = []
for i in sorted(res[0]['ENSG00000139687']['buckets'], key=lambda x:int(x["key"])):
    val.append(int(i["key"]))
    count.append(i["value"])
plt.bar(val, count, width=0.35)
```




    <BarContainer object of 4 artists>




![png](CNA_Histogram_files/CNA_Histogram_8_1.png)



```python

```
