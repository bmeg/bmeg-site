---
title: Get compound Information
draft: True
authors:
- kellrott
- adamstruck
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Get info about CCLE drug response experiments
---

```python
import json
import gripql

conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```


```python
responses = G.query().V("Program:CCLE").out("projects").out("cases").out("samples").\
    out("aliquots").as_("aliquot").\
    out("drug_response").as_("resp").\
    out("compounds").as_("compound").\
    render({"aliquot_id": "$aliquot._id",
            "compound_id": "$compound._id",
            "compound": "$compound",
            "drug_response_id": "$resp._id",
            "drug_response": "$resp"}).\
    execute()
```

    [INFO]	2020-01-14 14:00:13,305	11,670 results received in 4 seconds



```python

```




    <AttrDict({'approved_countries': [], 'chebi_id': 'CHEBI:91338', 'chembl_id': 'CHEMBL509032', 'id_source': 'PUBCHEM', 'inchi': 'InChI=1S/C30H40ClN7O3S/c1-21(2)42(39,40)28-8-6-5-7-26(28)33-29-24(31)20-32-30(35-29)34-25-10-9-23(19-27(25)41-4)37-13-11-22(12-14-37)38-17-15-36(3)16-18-38/h5-10,19-22H,11-18H2,1-4H3,(H2,32,33,34,35)', 'inchi_key': 'QQWUGDVOUVUTOY-UHFFFAOYSA-N', 'project_id': 'Project:Reference', 'pubchem_id': 'CID16038120', 'source_url': 'http://mychem.info/v1/query?q=pubchem.cid:"16038120"&fields=chebi.id,chebi.inchi,chebi.inchi_key,chebi.name,chembl.molecule_chembl_id,chembl.pref_name,chembl.inchi,chembl.inchi_key,chembl.molecule_synonyms,chembl.usan_stem_definition,pubchem.cid,pubchem.inchi,pubchem.inchi_key,drugbank.id,drugbank.inchi,drugbank.inchi_key,drugbank.products.approved,drugbank.products.country,drugbank.taxonomy.class,drugbank.taxonomy.direct-parent,drugbank.taxonomy.kingdom,drugbank.taxonomy.subclass,drugbank.taxonomy.superclass,drugbank.taxonomy.description&size=1', 'submitter_id': 'CHEMBL509032', 'synonym': '16038120'})>




```python
c = set()
a = set()
for resp in responses:
    c.add(resp.compound_id)
    a.add(resp.aliquot_id)

print("# compounds:",len(c))
print("# cell lines:",len(a))
```

    # compounds: 24
    # cell lines: 504



```python
print(json.dumps(responses[1].compound.to_dict(), indent=2))
```

    {
      "approved_countries": [],
      "chebi_id": "CHEBI:91338",
      "chembl_id": "CHEMBL509032",
      "id_source": "PUBCHEM",
      "inchi": "InChI=1S/C30H40ClN7O3S/c1-21(2)42(39,40)28-8-6-5-7-26(28)33-29-24(31)20-32-30(35-29)34-25-10-9-23(19-27(25)41-4)37-13-11-22(12-14-37)38-17-15-36(3)16-18-38/h5-10,19-22H,11-18H2,1-4H3,(H2,32,33,34,35)",
      "inchi_key": "QQWUGDVOUVUTOY-UHFFFAOYSA-N",
      "project_id": "Project:Reference",
      "pubchem_id": "CID16038120",
      "source_url": "http://mychem.info/v1/query?q=pubchem.cid:\"16038120\"&fields=chebi.id,chebi.inchi,chebi.inchi_key,chebi.name,chembl.molecule_chembl_id,chembl.pref_name,chembl.inchi,chembl.inchi_key,chembl.molecule_synonyms,chembl.usan_stem_definition,pubchem.cid,pubchem.inchi,pubchem.inchi_key,drugbank.id,drugbank.inchi,drugbank.inchi_key,drugbank.products.approved,drugbank.products.country,drugbank.taxonomy.class,drugbank.taxonomy.direct-parent,drugbank.taxonomy.kingdom,drugbank.taxonomy.subclass,drugbank.taxonomy.superclass,drugbank.taxonomy.description&size=1",
      "submitter_id": "CHEMBL509032",
      "synonym": "16038120"
    }



```python

```
