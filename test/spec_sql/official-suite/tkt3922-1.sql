-- original: tkt3922.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

CREATE TABLE t1(a NUMBER);
      INSERT INTO t1 VALUES('-9223372036854775808');
      SELECT a, typeof(a) FROM t1
;CREATE TABLE t1(a NUMBER);
      INSERT INTO t1 VALUES('-1');
      SELECT a, typeof(a) FROM t1
;DELETE FROM t1;
    INSERT INTO t1 VALUES('-9223372036854775809');
    SELECT a, typeof(a) FROM t1
;DELETE FROM t1;
    INSERT INTO t1 VALUES('-9223372036854776832');
    SELECT a, typeof(a) FROM t1
;DELETE FROM t1;
    INSERT INTO t1 VALUES('-9223372036854776833');
    SELECT a, typeof(a) FROM t1
;DELETE FROM t1;
      INSERT INTO t1 VALUES('9223372036854775807');
      SELECT a, typeof(a) FROM t1
;DELETE FROM t1;
      INSERT INTO t1 VALUES('1');
      SELECT a, typeof(a) FROM t1
;DELETE FROM t1;
    INSERT INTO t1 VALUES('9223372036854775808');
    SELECT a, typeof(a) FROM t1;