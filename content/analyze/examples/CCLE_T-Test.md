---
title: Drug Response
path: CCLE/t-test
authors:
- kellrott
- adamstruck
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Identify drug response seperation for CCLE cohorts defined by gene mutation
---

```python
import pandas
import gripql
import itertools
import scipy.stats as stats

conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Find all of the samples in the [CTRP](https://portals.broadinstitute.org/ctrp/) Breast Cancer experiment


```python
q = G.V("Program:CTRP").out("projects").out("cases").\
    has(gripql.eq("cellline_attributes.Primary Disease", "Breast Cancer")).distinct()
all_cases = []
for row in q:
    all_cases.append(row._id)
```

    [INFO]	2020-01-14 13:36:52,216	40 results received in 0 seconds


For the genes of interest, get Ensembl gene ids, from the HUGO symbols


```python
GENES = ["PTEN", "TP53"]
```


```python
gene_ids = {}
for i in G.V().hasLabel("Gene").has(gripql.within("symbol", GENES)):
    gene_ids[i.symbol] = i._id
```

    [INFO]	2020-01-14 13:36:56,003	2 results received in 0 seconds


The CTRP doesn't have direct mutation calling, but rather they used the same cell lines as the CCLE, and we can use the mutation calls from that project. So use the `same_as` edge to identify the cases from CCLE that are the same as the ones in CTRP. Then use the mutations from those samples.


```python
gene_ids
```




    {'TP53': 'ENSG00000141510', 'PTEN': 'ENSG00000171862'}



For each of the genes, find the set of samples that have a mutation in that gene


```python
mut_cases = {}
norm_cases = {}

q = G.V(all_cases).as_("ctrp").out("same_as").has(gripql.eq("project_id", "Project:CCLE"))
q = q.out("samples").out("aliquots").out("somatic_callsets")
q = q.outE("alleles").has(gripql.within("ensembl_gene", list(gene_ids.values())))
q = q.render({"case" : "$ctrp._id", "gene" : "$.ensembl_gene"})

for res in q:
    mut_cases[res.gene] = mut_cases.get(res.gene, set()) | set([res.case])

#get CCLE samples without mutation
for i in gene_ids.values():
    norm_cases[i] = list(set(all_cases).difference(mut_cases[i]))

    print( "%s Positive Set: %d" % (i, len(mut_cases[i])) )
    print( "%s Negative Set: %d" % (i, len(norm_cases[i])) )

```

    [INFO]	2020-01-14 13:39:36,629	43 results received in 0 seconds


    ENSG00000141510 Positive Set: 29
    ENSG00000141510 Negative Set: 11
    ENSG00000171862 Positive Set: 9
    ENSG00000171862 Negative Set: 31



```python
pos_response = {}
for g in gene_ids.values():
    pos_response[g] = {}
    q = G.V(list(mut_cases[g])).as_("a").out("samples").out("aliquots")
    q = q.out("drug_response").as_("a").out("compounds").as_("b")
    q = q.select(["a", "b"])
    for row in q:
        v = row['a']['data']['aac']
        compound = row['b']['_id']
        if compound not in pos_response[g]:
            pos_response[g][compound] = [ v ]
        else:
            pos_response[g][compound].append(v)

```

    [INFO]	2020-01-14 13:39:55,140	12,224 results received in 3 seconds
    [INFO]	2020-01-14 13:39:56,594	3,999 results received in 1 seconds



```python
neg_response = {}
for g in gene_ids.values():
    neg_response[g] = {}
    q = G.V(list(norm_cases[g])).as_("a").out("samples").out("aliquots")
    q = q.out("drug_response").as_("a").out("compounds").as_("b")
    q = q.select(["a", "b"])
    for row in q:
        v = row['a']['data']['aac']
        compound = row['b']['_id']
        if compound not in neg_response[g]:
            neg_response[g][compound] = [ v ]
        else:
            neg_response[g][compound].append(v)

```

    [INFO]	2020-01-14 13:39:59,162	5,025 results received in 1 seconds
    [INFO]	2020-01-14 13:40:03,457	13,250 results received in 4 seconds



```python
drugs = set(itertools.chain.from_iterable( i.keys() for i in pos_response.values() ))
out = []
for drug in drugs:
    for g in gene_ids.values():
        if drug in pos_response[g] and drug in neg_response[g]:
            row = {"drug" : drug, "mutation" : g}
            mut_values = pos_response[g][drug]
            norm_values = neg_response[g][drug]
            if len(mut_values) > 5 and len(norm_values) > 5:
                s = stats.ttest_ind(mut_values, norm_values, equal_var=False)
                row["t-statistic"] = s.statistic
                row["t-pvalue"] = s.pvalue
                s = stats.f_oneway(mut_values, norm_values)
                row["a-statistic"] = s.statistic
                row["a-pvalue"] = s.pvalue
                out.append(row)
```


```python
pandas.DataFrame(out, columns=["drug", "mutation", "t-statistic", "t-pvalue", "a-statistic", "a-pvalue"]).sort_values("a-pvalue").head(10)
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
      <th>drug</th>
      <th>mutation</th>
      <th>t-statistic</th>
      <th>t-pvalue</th>
      <th>a-statistic</th>
      <th>a-pvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>277</td>
      <td>Compound:CID216345</td>
      <td>ENSG00000141510</td>
      <td>-4.425335</td>
      <td>0.000366</td>
      <td>23.811104</td>
      <td>0.000019</td>
    </tr>
    <tr>
      <td>593</td>
      <td>Compound:CID16736978</td>
      <td>ENSG00000141510</td>
      <td>-3.177435</td>
      <td>0.006779</td>
      <td>12.249536</td>
      <td>0.001356</td>
    </tr>
    <tr>
      <td>214</td>
      <td>Compound:CID9967941</td>
      <td>ENSG00000141510</td>
      <td>-3.114875</td>
      <td>0.006419</td>
      <td>11.046079</td>
      <td>0.002136</td>
    </tr>
    <tr>
      <td>31</td>
      <td>Compound:CID9549297</td>
      <td>ENSG00000141510</td>
      <td>-2.573574</td>
      <td>0.021992</td>
      <td>10.077463</td>
      <td>0.003071</td>
    </tr>
    <tr>
      <td>480</td>
      <td>Compound:CID56949517</td>
      <td>ENSG00000171862</td>
      <td>2.235155</td>
      <td>0.069114</td>
      <td>10.480699</td>
      <td>0.003638</td>
    </tr>
    <tr>
      <td>808</td>
      <td>Compound:CID5472285</td>
      <td>ENSG00000141510</td>
      <td>-2.711139</td>
      <td>0.015176</td>
      <td>9.369077</td>
      <td>0.004037</td>
    </tr>
    <tr>
      <td>566</td>
      <td>Compound:NO_ONTOLOGY:CID9809715</td>
      <td>ENSG00000141510</td>
      <td>-2.492241</td>
      <td>0.026354</td>
      <td>8.810857</td>
      <td>0.005631</td>
    </tr>
    <tr>
      <td>237</td>
      <td>Compound:CID451668</td>
      <td>ENSG00000171862</td>
      <td>2.030714</td>
      <td>0.051533</td>
      <td>7.157550</td>
      <td>0.008627</td>
    </tr>
    <tr>
      <td>95</td>
      <td>Compound:CID54686904</td>
      <td>ENSG00000171862</td>
      <td>2.241852</td>
      <td>0.067998</td>
      <td>8.668157</td>
      <td>0.009525</td>
    </tr>
    <tr>
      <td>656</td>
      <td>Compound:CID11609586</td>
      <td>ENSG00000171862</td>
      <td>1.948182</td>
      <td>0.066221</td>
      <td>6.818910</td>
      <td>0.011089</td>
    </tr>
  </tbody>
</table>
</div>
