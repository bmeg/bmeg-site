---
title: Allele Lookup
weight: 20
authors:
- kellrott
- adamstruck
tags:
- ccle
- drug response
created_at: 2018-05-09
updated_at: 2020-01-14
tldr: Look up an allele
---

```python
import hashlib
import gripql
conn = gripql.Connection("https://bmeg.io/api", credential_file="bmeg_credentials.json")
G = conn.graph("rc6_1")
```

BMEG stores alleles using a hashed version of the alteration description
```
genome:chromosome:start:reference_bases:alternate_bases
```
So an example allele would be:
```
GRCh37:1:27100988:C:T
```
Which is then run though a `sha1` hash to get the string
```
0b0a7a23d57414e768677a6cbd764563922209df
```


```python
def allele_gid(genome: str, chromosome: str, start: int,
               reference_bases: str, alternate_bases: str):

    if not all(v is not None for v in [genome, chromosome, start,
                                       reference_bases, alternate_bases]):
        raise ValueError("one or more args was None")

    start = int(start)
    if reference_bases == "-" or alternate_bases == "-":
        pass
    elif reference_bases[0] != alternate_bases[0]:
        pass
    elif len(reference_bases) > len(alternate_bases):
        common = os.path.commonprefix([reference_bases, alternate_bases])
        reference_bases = reference_bases[len(common):]
        if len(alternate_bases) == len(common):
            alternate_bases = "-"
        else:
            alternate_bases = alternate_bases[len(common):]
        start += len(common)
    elif len(reference_bases) < len(alternate_bases):
        common = os.path.commonprefix([reference_bases, alternate_bases])
        alternate_bases = alternate_bases[len(common):]
        if len(reference_bases) == len(common):
            reference_bases = "-"
        else:
            reference_bases = reference_bases[len(common):]

    vid = "{}:{}:{}:{}:{}".format(genome, chromosome, start, reference_bases, alternate_bases)
    vid = vid.encode('utf-8')
    vidhash = hashlib.sha1()
    vidhash.update(vid)
    vidhash = vidhash.hexdigest()
    return "Allele:{}".format(vidhash)
```


```python
chrom = 1
loc = 27100988
ids = []
for r in ['A', 'C', 'G', 'T']:
    for a in ['A', 'C', 'G', 'T']:
        ids.append( allele_gid("GRCh37", chrom, loc, r, a) )
for row in G.query().V(ids):
    print( row )
```

{'_id': 'Allele:a457a505c1551c4dbd936cddb388b021422bc0bc', '_label': 'Allele', 'all_effects': 'ARID1A,stop_gained,p.Gln1424Ter,ENST00000324856,NM_006015.4;ARID1A,stop_gained,p.Gln1041Ter,ENST00000374152,;ARID1A,stop_gained,p.Gln321Ter,ENST00000430799,;ARID1A,intron_variant,,ENST00000457599,NM_139135.2;ARID1A,intron_variant,,ENST00000540690,;ARID1A,intron_variant,,ENST00000466382,;ARID1A,upstream_gene_variant,,ENST00000532781,;', 'alternate_bases': 'T', 'amino_acids': 'Q/*', 'biotype': 'protein_coding', 'cdna_position': '4641/8577', 'cds_position': '4270/6858', 'chromosome': '1', 'codons': 'Cag/Tag', 'end': 27100988, 'ensembl_gene': 'ENSG00000117713', 'ensembl_protein': 'ENSP00000320485', 'ensembl_transcript': 'ENST00000324856', 'exon_number': '18/20', 'genome': 'GRCh37', 'hgnc_id': '11110', 'hgvsc': 'c.4270C>T', 'hgvsp': 'p.Gln1424Ter', 'hgvsp_short': 'p.Q1424*', 'hugo_symbol': 'ARID1A', 'impact': 'HIGH', 'project_id': 'Project:Reference', 'protein_position': '1424/2285', 'reference_bases': 'C', 'start': 27100988, 'strand': '+', 'submitter_id': None, 'variant_classification': 'Nonsense_Mutation', 'variant_type': 'SNP'}
