-- original: corrupt8.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

PRAGMA auto_vacuum=1;
    PRAGMA page_size=1024;
    CREATE TABLE t1(x);
    INSERT INTO t1(x) VALUES(1);
    INSERT INTO t1(x) VALUES(2);
    INSERT INTO t1(x) SELECT x+2 FROM t1;
    INSERT INTO t1(x) SELECT x+4 FROM t1;
    INSERT INTO t1(x) SELECT x+8 FROM t1;
    INSERT INTO t1(x) SELECT x+16 FROM t1;
    INSERT INTO t1(x) SELECT x+32 FROM t1;
    INSERT INTO t1(x) SELECT x+64 FROM t1;
    INSERT INTO t1(x) SELECT x+128 FROM t1;
    INSERT INTO t1(x) SELECT x+256 FROM t1;
    CREATE TABLE t2(a,b);
    INSERT INTO t2 SELECT x, x*x FROM t1
;PRAGMA integrity_check
;PRAGMA integrity_check
;PRAGMA integrity_check
;PRAGMA integrity_check;