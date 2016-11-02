-- original: win32longpath.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

BEGIN EXCLUSIVE;
    CREATE TABLE t1(x);
    INSERT INTO t1 VALUES(1);
    INSERT INTO t1 VALUES(2);
    INSERT INTO t1 VALUES(3);
    INSERT INTO t1 VALUES(4);
    SELECT x FROM t1 ORDER BY x;
    COMMIT
;BEGIN EXCLUSIVE;
    CREATE TABLE t1(x);
    INSERT INTO t1 VALUES(5);
    INSERT INTO t1 VALUES(6);
    INSERT INTO t1 VALUES(7);
    INSERT INTO t1 VALUES(8);
    SELECT x FROM t1 ORDER BY x;
    COMMIT
;PRAGMA journal_mode = WAL
;BEGIN EXCLUSIVE;
    INSERT INTO t1 VALUES(9);
    INSERT INTO t1 VALUES(10);
    INSERT INTO t1 VALUES(11);
    INSERT INTO t1 VALUES(12);
    SELECT x FROM t1 ORDER BY x;
    COMMIT;