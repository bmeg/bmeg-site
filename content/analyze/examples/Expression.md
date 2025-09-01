---
title: Expression Data
weight: 70
authors:
- kellrott
- adamstruck
tags:
- tcga
- gene expression
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Build a pandas matrix of expression data
---

```python
import seaborn as sns
import pandas
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Download gene expression values from TCGA-READ cohort and build matrix with submitter id as label


```python
c = G.query().V("Project:TCGA-READ").out("cases").out("samples").as_("sample")
c = c.out("aliquots").out("gene_expressions").as_("exp")
c = c.render( ["$sample.gdc_attributes.submitter_id", "$exp.values"])

data = {}
for row in c.execute(stream=True):
    data[row[0]] = row[1]
```

    [INFO]	2020-01-14 14:06:01,252	177 results received in 35 seconds


Take the data we downloaded and turn it into a Pandas data frame


```python
samples = pandas.DataFrame(data).transpose().fillna(0.0)
```

Take a look at the top corner of the dataframe


```python
samples.iloc[:5,:5]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>ENSG00000000003</th>
      <th>ENSG00000000005</th>
      <th>ENSG00000000419</th>
      <th>ENSG00000000457</th>
      <th>ENSG00000000460</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>TCGA-G5-6233-01A</td>
      <td>30.212803</td>
      <td>0.063489</td>
      <td>87.317567</td>
      <td>6.237288</td>
      <td>5.518520</td>
    </tr>
    <tr>
      <td>TCGA-AG-4021-01A</td>
      <td>80.356975</td>
      <td>3.621759</td>
      <td>48.649980</td>
      <td>8.770929</td>
      <td>8.975365</td>
    </tr>
    <tr>
      <td>TCGA-EI-6514-01A</td>
      <td>142.160017</td>
      <td>2.460405</td>
      <td>82.308962</td>
      <td>4.144567</td>
      <td>3.251904</td>
    </tr>
    <tr>
      <td>TCGA-AG-3725-01A</td>
      <td>81.611032</td>
      <td>4.730710</td>
      <td>56.783610</td>
      <td>4.896992</td>
      <td>4.208633</td>
    </tr>
    <tr>
      <td>TCGA-AG-3725-11A</td>
      <td>78.390851</td>
      <td>1.037580</td>
      <td>51.193885</td>
      <td>6.455982</td>
      <td>2.212233</td>
    </tr>
  </tbody>
</table>
</div>



Take a quick look to see the top expressing samples for the gene `ENSG00000000003`


```python
samples["ENSG00000000003"].sort_values(ascending=False).head()
```




    TCGA-DC-5869-01A    281.005900
    TCGA-DC-6683-01A    258.010380
    TCGA-AF-3913-01A    254.599210
    TCGA-EF-5831-01A    253.774315
    TCGA-DC-6157-01A    251.170374
    Name: ENSG00000000003, dtype: float64




```python
sns.kdeplot(samples['ENSG00000000003'], color="g")
```




    <matplotlib.axes._subplots.AxesSubplot at 0x11ceef450>




![png](Expression_files/Expression_10_1.png)



```python

```
