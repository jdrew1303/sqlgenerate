-- original: corrupt5.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

CREATE TABLE t1(a,b,c);
    CREATE INDEX i1 ON t1(a,b);
    PRAGMA writable_schema=ON;
    UPDATE sqlite_master SET name=NULL, sql=NULL WHERE name='i1';