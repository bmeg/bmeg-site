---
title: Differential Expression
weight: 71
authors:
- kellrott
- adamstruck
tags:
- TCGA
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Look at differential expression patterns
---

```python
import matplotlib.pyplot as plt
import seaborn as sns
import pandas
from scipy.stats import ttest_ind
import gripql
```


```python
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Look at the expression in the [TCGA LUAD project](https://portal.gdc.cancer.gov/projects/TCGA-LUAD)


```python
PROJECT="Project:TCGA-LUAD"
```

Starting from the TCGA-LUAD project, follow the edges from `Project` -> `Case` -> `Sample` -> `Aliquot` -> `GeneExpression`. At the `Sample` node, we select from `Solid Tissue Normal` so we only pull the normals during this query.

Once on the gene expression node, extract the `values`, which hold the gene expression values in a Map[String,Float] format with Ensembl Gene ids as the keys, and the Gene expression TPMs as the values. We then load that into a Pandas data frame, and transpose so that the rows are the sample ids.


```python
c = G.V(PROJECT).out("cases").out("samples").as_("sample")
c = c.has(gripql.eq("gdc_attributes.sample_type", "Solid Tissue Normal"))
c = c.out("aliquots").out("gene_expressions").as_("exp")
c = c.render( ["$sample.gdc_attributes.submitter_id", "$exp.values"])
data = {}
for row in c.execute(stream=True):
    data[row[0]] = row[1]
normalDF = pandas.DataFrame(data).transpose()
```

    [INFO]	2020-01-14 14:07:38,218	59 results received in 12 seconds


Do the Project to Gene Expression traversal again, but this time only select the tumor samples.


```python
c = G.V(PROJECT).out("cases").out("samples").as_("sample")
c = c.has(gripql.eq("gdc_attributes.sample_type", "Primary Tumor"))
c = c.out("aliquots").out("gene_expressions").as_("exp")
c = c.render( ["$sample.gdc_attributes.submitter_id", "$exp.values"])
data = {}
for row in c.execute(stream=True):
    data[row[0]] = row[1]
tumorDF = pandas.DataFrame(data).transpose()
```

    [INFO]	2020-01-14 14:09:27,596	539 results received in 107 seconds


For each gene, run t-test to determine the genes with the most differential expression between the tumor and normal sets.


```python
stats = {}
for gene in tumorDF:
    s = ttest_ind(tumorDF[gene], normalDF[gene])
    stats[gene] = { 'statistic': s.statistic, 'pvalue' : s.pvalue }
statsDF = pandas.DataFrame(stats).transpose()
```

Display the results


```python
statsDF[ statsDF['pvalue'] < 0.0001 ].sort_values('statistic').head()
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
      <th>statistic</th>
      <th>pvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>ENSG00000168484</td>
      <td>-53.356952</td>
      <td>6.389050e-227</td>
    </tr>
    <tr>
      <td>ENSG00000135604</td>
      <td>-48.643308</td>
      <td>9.675744e-208</td>
    </tr>
    <tr>
      <td>ENSG00000204305</td>
      <td>-46.262534</td>
      <td>1.283753e-197</td>
    </tr>
    <tr>
      <td>ENSG00000114854</td>
      <td>-44.158458</td>
      <td>2.022993e-188</td>
    </tr>
    <tr>
      <td>ENSG00000022267</td>
      <td>-40.822561</td>
      <td>2.395204e-173</td>
    </tr>
  </tbody>
</table>
</div>



Using the top gene from the T-Test experiment (ENSG00000168484), plot the expression of the gene across the tumor and normal samples


```python
sns.kdeplot(tumorDF['ENSG00000168484'], color="r")
sns.kdeplot(normalDF['ENSG00000168484'], color="g")
```




    <matplotlib.axes._subplots.AxesSubplot at 0x11677b8d0>




![png](ExpressionDifference_files/ExpressionDifference_14_1.png)


Do a quick search of `ENSG00000168484` to identify the Gene Ontology terms that it is linked to


```python
for row in G.V("ENSG00000168484").out("gene_ontology_terms"):
    print(row._id, row.definition)
```

    [INFO]	2020-01-14 14:10:14,516	10 results received in 0 seconds


    GeneOntologyTerm:GO:0005515 Interacting selectively and non-covalently with any protein or protein complex (a complex of two or more proteins that may include other nonprotein molecules).
    GeneOntologyTerm:GO:0005576 The space external to the outermost structure of a cell. For cells without external protective or external encapsulating structures this refers to space outside of the plasma membrane. This term covers the host cell environment outside an intracellular parasite.
    GeneOntologyTerm:GO:0005615 That part of a multicellular organism outside the cells proper, usually taken to be outside the plasma membranes, and occupied by fluid.
    GeneOntologyTerm:GO:0005789 The lipid bilayer surrounding the endoplasmic reticulum.
    GeneOntologyTerm:GO:0007585 The process of gaseous exchange between an organism and its environment. In plants, microorganisms, and many small animals, air or water makes direct contact with the organism's cells or tissue fluids, and the processes of diffusion supply the organism with dioxygen (O2) and remove carbon dioxide (CO2). In larger animals the efficiency of gaseous exchange is improved by specialized respiratory organs, such as lungs and gills, which are ventilated by breathing mechanisms.
    GeneOntologyTerm:GO:0042599 A membrane-bounded organelle, specialized for the storage and secretion of various substances (surfactant phospholipids, glycoproteins and acid phosphates) which are arranged in the form of tightly packed, concentric, membrane sheets or lamellae. Has some similar properties to, but is distinct from, a lysosome.
    GeneOntologyTerm:GO:0042802 Interacting selectively and non-covalently with an identical protein or proteins.
    GeneOntologyTerm:GO:0044267 The chemical reactions and pathways involving a specific protein, rather than of proteins in general, occurring at the level of an individual cell. Includes cellular protein modification.
    GeneOntologyTerm:GO:0045334 A clathrin-coated, membrane-bounded intracellular vesicle formed by invagination of the plasma membrane around an extracellular substance.
    GeneOntologyTerm:GO:0097486 The volume enclosed by the outermost membrane of a multivesicular body.



```python

```
