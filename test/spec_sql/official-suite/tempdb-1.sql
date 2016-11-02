-- original: tempdb.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

BEGIN;
    CREATE TABLE t1(x UNIQUE);
    CREATE TABLE t2(y);
    INSERT INTO t2 VALUES('hello');
    INSERT INTO t2 VALUES(NULL)
;SELECT * FROM t1
;CREATE TABLE t1 (a PRIMARY KEY, b, c);
    CREATE TABLE t2 (a, b, c);
    BEGIN;
      INSERT INTO t1 VALUES(1, 2, 3);
      INSERT INTO t1 VALUES(4, 5, 6);
      INSERT INTO t2 VALUES(7, 8, 9);
      INSERT INTO t2 SELECT * FROM t1
;PRAGMA temp_store = 'memory';
    ROLLBACK;
    BEGIN;
      INSERT INTO t1 VALUES(1, 2, 3);
      INSERT INTO t1 VALUES(4, 5, 6);
      INSERT INTO t2 SELECT * FROM t1;