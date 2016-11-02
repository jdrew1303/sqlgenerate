-- original: tkt2251.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

CREATE TABLE t1(a INTEGER);
    INSERT INTO t1 VALUES(1);
    INSERT INTO t1 VALUES(1);
    INSERT INTO t1 VALUES(2);
    INSERT INTO t1 VALUES(9);
    INSERT INTO t1 VALUES(9);
    INSERT INTO t1 VALUES(9);
    INSERT INTO t1 VALUES(3);
    INSERT INTO t1 VALUES(2);
    ALTER TABLE t1 ADD COLUMN b REAL DEFAULT 4.0;
    SELECT avg(b), typeof(avg(b)) FROM t1
;SELECT sum(b), typeof(sum(b)) FROM t1
;SELECT a, sum(b), typeof(sum(b)) FROM t1 GROUP BY a ORDER BY a
;SELECT b, typeof(b) FROM t1 WHERE a=3
;CREATE INDEX t1i1 ON t1(a,b);
    SELECT b, typeof(b) FROM t1 WHERE a=3
;REINDEX;
    SELECT b, typeof(b) FROM t1 WHERE a=3
;CREATE TABLE t2(x,y);
    INSERT INTO t2 SELECT * FROM t1;
    SELECT y, typeof(y) FROM t2 WHERE x=3
;CREATE TABLE t3 AS SELECT * FROM t1;
    SELECT b, typeof(b) FROM t3 WHERE a=3;