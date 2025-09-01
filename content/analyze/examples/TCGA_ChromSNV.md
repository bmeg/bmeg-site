---
title: Cohort Genomics
weight: 64
authors:
- kellrott
- adamstruck
tags:
- tcga
- genomics
created_at: 2019-07-26
updated_at: 2020-01-14
tldr: Count the number of mutations per chromosome in the TCGA-BRCA cohort
---
Connect to BMEG server


```python
import matplotlib.pyplot as plt
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Do a query that starts on the TCGA BRCA cohort, goes though Cases -> Samples -> Aliquots -> SomaticCallsets -> Alleles.
Once at the alleles, do an aggrigation to count the number of times each chromsome occurs


```python
q = G.query().V("Project:TCGA-BRCA").out("cases").out("samples")
q = q.has(gripql.eq("gdc_attributes.sample_type", "Primary Tumor"))
q = q.out("aliquots").out("somatic_callsets").out("alleles")
q = q.has(gripql.eq("variant_type", "SNP"))
q = q.aggregate(gripql.term("chrom", "chromosome"))
res = q.execute()
```

    [INFO]	2020-01-14 14:24:22,453	1 results received in 9 seconds


Visualize the results


```python
name = []
count = []
for i in res[0].chrom.buckets:
    name.append(i["key"])
    count.append(i["value"])
plt.bar(name, count, width=0.35)
```




    <BarContainer object of 24 artists>




![png](TCGA_ChromSNV_files/TCGA_ChromSNV_6_1.png)



```python

```
