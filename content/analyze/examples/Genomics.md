---
title: Gene Mutation Hotstops
weight: 63
authors:
- kellrott
- adamstruck
- matthewpeterkort
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2025-09-05
tldr: Build a rolling average of mutations for a given gene region
---
For this example, we will start from a single gene, and identify all mutations that occur on it.


```python
import matplotlib.pyplot as plt
import pandas
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Get BRCA1 start and stop locations


```python
loc = G.V().hasLabel("Gene").has(gripql.eq("symbol", "BRCA1")).render(["$.start", "$.end"]).execute()[0]
```

    [INFO]	2020-01-14 14:12:16,554	1 results received in 0 seconds


Run an aggregation query to count up all the mutations


```python
counts = [0] * (loc[1]-loc[0])
q = G.V().hasLabel("Gene").has(gripql.eq("symbol", "BRCA1"))
q = q.out("alleles").has(gripql.and_(gripql.eq("variant_type", "SNP"),
                                     gripql.gte("start", loc[0]),
                                     gripql.lte("end", loc[1])))

for v in q.aggregate(gripql.term("brac1_pos", "start")):
    counts[ v['key'] - loc[0] ] = v['value']
```

    [INFO]	2020-01-14 14:17:12,740	1 results received in 0 seconds


Save as a dataframe

```python
s = pandas.DataFrame(counts)
```

Plot the hotspots


```python
rolling_sum = s.rolling(500).sum()
rolling_sum.plot(title="Rolling Sum of Simulated Data")
plt.xlabel("Position (relative to start)")
plt.ylabel("Rolling Sum of Values")
plt.show()

```




    <matplotlib.axes._subplots.AxesSubplot at 0x122303e10>




![png](Genomics_files/Genomics_10_1.png)



```python

```
