-- original: tkt2942.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

create table t1(num int);
    insert into t1 values (2);
    insert into t1 values (1);
    insert into t1 values (3);
    insert into t1 values (4);
    SELECT group_concat(num) FROM (SELECT num FROM t1 ORDER BY num DESC)
;SELECT group_concat(num) FROM (SELECT num FROM t1 ORDER BY num)
;SELECT group_concat(num) FROM (SELECT num FROM t1)
;SELECT group_concat(num) FROM (SELECT num FROM t1 ORDER BY rowid DESC);