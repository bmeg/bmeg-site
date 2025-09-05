---
title: Gene Info
weight: 30
authors:
- kellrott
- adamstruck
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2025-09-05
tldr: Look up gene ontology information and references
---

```python
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

Look up a gene by its hugo symbol


```python
gids = G.V().hasLabel("Gene").has(gripql.eq("$.symbol", "BRCA1")).render("_id").execute()
```

    [INFO]	2020-01-14 14:11:07,060	1 results received in 0 seconds


Find some of the Gene Ontology terms the gene is linked to


```python
for ent in G.V(gids).out("gene_ontology_terms").limit(10):
    print(ent["_id"], ent["definition"])

```

    [INFO]	2020-01-14 14:11:09,590	10 results received in 0 seconds


    GeneOntologyTerm:GO:0000724 The error-free repair of a double-strand break in DNA in which the broken DNA molecule is repaired using homologous sequences. A strand in the broken DNA searches for a homologous region in an intact chromosome to serve as the template for DNA synthesis. The restoration of two intact DNA molecules results in the exchange, reciprocal or nonreciprocal, of genetic material between the intact DNA molecule and the broken DNA molecule.
    GeneOntologyTerm:GO:0000800 A proteinaceous core found between sister chromatids during meiotic prophase.
    GeneOntologyTerm:GO:0003713 A protein or a member of a complex that interacts specifically and non-covalently with a DNA-bound DNA-binding transcription factor to activate the transcription of specific genes. Coactivators often act by altering chromatin structure and modifications. For example, one class of transcription coregulators modifies chromatin structure through covalent modification of histones. A second ATP-dependent class modifies the conformation of chromatin. Another type of coregulator activity is the bridging of a DNA-binding transcription factor to the basal transcription machinery. The Mediator complex, which bridges transcription factors and RNA polymerase, is also a transcription coactivator.
    GeneOntologyTerm:GO:0003723 Interacting selectively and non-covalently with an RNA molecule or a portion thereof.
    GeneOntologyTerm:GO:0004842 Catalysis of the transfer of ubiquitin from one protein to another via the reaction X-Ub + Y --> Y-Ub + X, where both X-Ub and Y-Ub are covalent linkages.
    GeneOntologyTerm:GO:0005515 Interacting selectively and non-covalently with any protein or protein complex (a complex of two or more proteins that may include other nonprotein molecules).
    GeneOntologyTerm:GO:0005634 A membrane-bounded organelle of eukaryotic cells in which chromosomes are housed and replicated. In most cells, the nucleus contains all of the cell's chromosomes except the organellar chromosomes, and is the site of RNA synthesis and processing. In some species, or in specialized cell types, RNA metabolism or DNA replication may be absent.
    GeneOntologyTerm:GO:0005654 That part of the nuclear content other than the chromosomes or the nucleolus.
    GeneOntologyTerm:GO:0005737 All of the contents of a cell excluding the plasma membrane and nucleus, but including other subcellular structures.
    GeneOntologyTerm:GO:0006302 The repair of double-strand breaks in DNA via homologous and nonhomologous mechanisms to reform a continuous DNA helix.



```python

```
