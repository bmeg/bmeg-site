---
title: Kaplan Meier
authors:
- kellrott
- adamstruck
tags:
- tcga
created_at: 2018-05-10
updated_at: 2020-01-14
tldr: Make Kaplan Meier curves using TCGA data
---
Install the [lifelines](https://lifelines.readthedocs.io) library


```python
!pip install lifelines
```

    Collecting lifelines
    [?25l  Downloading https://files.pythonhosted.org/packages/a5/8e/56c7d3bba5cf2f579a664c553900a2273802e0582bd4bdd809cdd6755b01/lifelines-0.23.6-py2.py3-none-any.whl (407kB)
    [K     |████████████████████████████████| 409kB 4.1MB/s eta 0:00:01
    [?25hCollecting autograd>=1.3
      Downloading https://files.pythonhosted.org/packages/23/12/b58522dc2cbbd7ab939c7b8e5542c441c9a06a8eccb00b3ecac04a739896/autograd-1.3.tar.gz
    Requirement already satisfied: scipy>=1.0 in /usr/local/lib/python3.7/site-packages (from lifelines) (1.3.1)
    Collecting matplotlib>=3.0
      Using cached https://files.pythonhosted.org/packages/a0/76/68bc3374ffa2d8d3dfd440fe94158fa8aa2628670fa38bdaf186c9af0d94/matplotlib-3.1.2-cp37-cp37m-macosx_10_9_x86_64.whl
    Collecting autograd-gamma>=0.3
      Downloading https://files.pythonhosted.org/packages/3e/87/788c4bf90cc5c534cb3b7fdb5b719175e33e2658decce75e35e2ce69766f/autograd_gamma-0.4.1-py2.py3-none-any.whl
    Requirement already satisfied: numpy>=1.14.0 in /usr/local/lib/python3.7/site-packages (from lifelines) (1.17.3)
    Requirement already satisfied: pandas>=0.23.0 in /usr/local/lib/python3.7/site-packages (from lifelines) (0.25.1)
    Requirement already satisfied: future>=0.15.2 in /usr/local/lib/python3.7/site-packages (from autograd>=1.3->lifelines) (0.17.1)
    Requirement already satisfied: pyparsing!=2.0.4,!=2.1.2,!=2.1.6,>=2.0.1 in /usr/local/lib/python3.7/site-packages (from matplotlib>=3.0->lifelines) (2.2.0)
    Requirement already satisfied: python-dateutil>=2.1 in /usr/local/lib/python3.7/site-packages (from matplotlib>=3.0->lifelines) (2.7.3)
    Requirement already satisfied: cycler>=0.10 in /usr/local/lib/python3.7/site-packages (from matplotlib>=3.0->lifelines) (0.10.0)
    Requirement already satisfied: kiwisolver>=1.0.1 in /usr/local/lib/python3.7/site-packages (from matplotlib>=3.0->lifelines) (1.0.1)
    Requirement already satisfied: pytz>=2017.2 in /usr/local/lib/python3.7/site-packages (from pandas>=0.23.0->lifelines) (2018.5)
    Requirement already satisfied: six>=1.5 in /usr/local/lib/python3.7/site-packages (from python-dateutil>=2.1->matplotlib>=3.0->lifelines) (1.12.0)
    Requirement already satisfied: setuptools in /usr/local/lib/python3.7/site-packages (from kiwisolver>=1.0.1->matplotlib>=3.0->lifelines) (42.0.2)
    Building wheels for collected packages: autograd
      Building wheel for autograd (setup.py) ... [?25ldone
    [?25h  Created wheel for autograd: filename=autograd-1.3-cp37-none-any.whl size=47990 sha256=a14ecb3ba1b6a4626c2721a672f67abab2d2726c463406a31951fcff0effe5d6
      Stored in directory: /Users/strucka/Library/Caches/pip/wheels/42/62/66/1121afe23ff96af4e452e0d15e68761e3f605952ee075ca99f
    Successfully built autograd
    Installing collected packages: autograd, matplotlib, autograd-gamma, lifelines
      Found existing installation: matplotlib 2.2.2
        Uninstalling matplotlib-2.2.2:
          Successfully uninstalled matplotlib-2.2.2
    Successfully installed autograd-1.3 autograd-gamma-0.4.1 lifelines-0.23.6 matplotlib-3.1.2



```python
from lifelines import KaplanMeierFitter
import matplotlib.pyplot as plt

import pandas
import gripql

conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Look at the TCGA-BRCA cohort, and find all of the cases where there is a recorded `days_to_death`


```python
q = G.V("Project:TCGA-BRCA").out("cases")

data = {}
for i in q:
    if i.gdc_attributes.demographic is not None and i.gdc_attributes.demographic.vital_status == "Dead":
        if 'days_to_death' in i.gdc_attributes.demographic:
            data[ i._id ] = i.gdc_attributes.demographic.days_to_death
survival = pandas.Series(data)
```

    [INFO]	2020-01-14 14:18:49,810	1,098 results received in 0 seconds


Gene ensembl gene id for `TP53`


```python
gene = G.V().hasLabel("Gene").has(gripql.eq("symbol", "TP53")).execute()[0].gene_id
print(gene)
```

    [INFO]	2020-01-14 14:19:08,643	1 results received in 0 seconds


    ENSG00000141510


Starting from the cases with attached survival information, find all of the cases that have a mutation in the gene on interest


```python
q = G.V(list(survival.keys())).as_("case").out("samples").out("aliquots").out("somatic_callsets").out("alleles")
q = q.has(gripql.eq("ensembl_gene", gene))
q = q.select("case").distinct("$._id").render("$._id")
mut_cases = list(q)
```

    [INFO]	2020-01-14 14:19:47,044	52 results received in 2 seconds


Plot a Kaplan Meirer curve to demonstrate the different in survival of the somatic mutation group and those with no somatic mutation.


```python
kmf = KaplanMeierFitter()

ax = plt.subplot(111)
kmf.fit(survival[mut_cases], label="%s Mutations" % (gene))
ax = kmf.plot(ax=ax)
kmf.fit(survival[ survival.index.difference(mut_cases) ], label="No Mutation")
kmf.plot(ax=ax)
```




    <matplotlib.axes._subplots.AxesSubplot at 0x1205a8d10>




![png](KM_files/KM_11_1.png)



```python

```
