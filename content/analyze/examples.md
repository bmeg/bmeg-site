---
title: Analysis Examples
---

## Using BMEG to get matrix data

Many vertices in the BMEG contain complex data that can be collected and
converted into matrix data.

### Download RNA-Seq for cohort:TCGA-READ

```python
import pandas
import gripql

conn = gripql.Connection("http://bmeg.io")
O = conn.graph("bmeg")

c = O.query().V().hasLabel("Individual")
c = c.has(gripql.and_(gripql.eq("source", "tcga"), gripql.eq("disease_code", "READ")))
c = c.in_("sampleOf").in_("expressionFor")
c = c.render(["$.biosampleId", "$.expressions"])

data = {}
for row in c:
    data[row[0]] = row[1]
samples = pandas.DataFrame(data).transpose().fillna(0.0)
```


## Make Kaplan Meier curves using TCGA data

```python
from lifelines import KaplanMeierFitter
import pandas
import gripql

conn = gripql.Connection("http://bmeg.io")
O = conn.graph("bmeg")

q = O.query().V().hasLabel("Individual")
q = q.has(gripql.and_(gripql.eq("source", "tcga"), gripql.eq("disease_code", "BRCA")))
q = q.where(gripql.eq("vital_status", "Dead"))

q1 = q.where(gripql.eq('her2_status_by_ihc', 'Positive')).render(["death_days_to"])
q2 = q.where(gripql.eq('her2_status_by_ihc', 'Negative')).render(["death_days_to"])

days_a = list(int(a[0]) for a in q1)
days_b = list(int(a[0]) for a in q2)

kmf = KaplanMeierFitter()
kmf.fit(days_a, label="HER2 Positive")
ax = kmf.plot()
kmf.fit(days_b, label="HER2 Negative")
kmf.plot(ax=ax)
```

Returns

![HER2 KM Curve](/img/her2_km.png)

## Using Cancer Cell Line Encyclopedia (CCLE) to do drug response analysis

Get all CCLE samples
```
q = O.query().V().hasLabel("Biosample")
q = q.has(gripql.and_(gripql.eq("source", "ccle"))).render({"id":"_gid"})
all_samples = []
for row in q:
    all_samples.append(row.id)
```

Genes we'll be looking at
```
GENES = ["CDKN2A", "PTEN", "TP53", "SMAD4"]
gene_ids = {}
for g in GENES:
    for i in O.query().V().hasLabel("Gene").has(gripql.eq("symbol", g)):
        gene_ids[g] = i.gid
```

Scan CCLE cell lines based on mutation status
```
mut_samples = {}
norm_samples = {}
for g, i in gene_ids.items():
    #get CCLE samples with mutation
    mut_samples[g] = set(k['gid'] for k in O.query().V(i).in_("variantIn").out("variantCall").out("callSetOf").has(gripql.in_("_gid", all_samples)).render({"gid":"_gid"}))

    #get CCLE samples without mutation
    norm_samples[g] = list(set(all_samples).difference(mut_samples[g]))

    print "%s Positive Set: %d" % (g, len(mut_samples[g]))
    print "%s Negative Set: %d" % (g, len(norm_samples[g]))
```

Get response values for the positive set (samples with mutation) and collect AUC value by drug
```
pos_response = {}
for g in GENES:
    pos_response[g] = {}
    for row in O.query().V(mut_samples[g]).in_("responseFor").as("a").out("responseTo").as("b").select(["a", "b"]):
        for v in row['a']['data']['summary']:
            if v['type'] == "AUC":
                compound = row['b']['gid']
                if compound not in pos_response[g]:
                    pos_response[g][compound] = [ v["value"] ]
                else:
                    pos_response[g][compound].append(v["value"])
```


Get response values for the negative set (samples without mutation) and collect AUC value by drug
```
neg_response = {}
for g in GENES:
    neg_response[g] = {}
    for row in O.query().V(norm_samples[g]).in_("responseFor").as("a").out("responseTo").as("b").select(["a", "b"]):
        for v in row['a']['data']['summary']:
            if v['type'] == "AUC":
                compound = row['b']['gid']
                if compound not in neg_response[g]:
                    neg_response[g][compound] = [ v["value"] ]
                else:
                    neg_response[g][compound].append(v["value"])
```

Collect t-test statistics
```
drugs = set(itertools.chain.from_iterable( i.keys() for i in pos_response.values() ))
out = []
for drug in drugs:
    for g in GENES:
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

Print data sorted by statistical value
```
pandas.DataFrame(out, columns=["drug", "mutation", "t-statistic", "t-pvalue", "a-statistic", "a-pvalue"]).sort_values("a-pvalue")
```