-- original: tkt-f973c7ac31.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

CREATE TABLE t(c1 INTEGER, c2 INTEGER);
    INSERT INTO t VALUES(5, 5);
    INSERT INTO t VALUES(5, 4)
;SELECT * FROM t WHERE c1 = 5 AND c2>0 AND c2<='2' ORDER BY c2 DESC
;SELECT * FROM t WHERE c1 = 5 AND c2>0 AND c2<=5 ORDER BY c2 DESC
;SELECT * FROM t WHERE c1 = 5 AND c2>0 AND c2<='5' ORDER BY c2 DESC
;SELECT * FROM t WHERE c1 = 5 AND c2>'0' AND c2<=5 ORDER BY c2 DESC
;SELECT * FROM t WHERE c1 = 5 AND c2>'0' AND c2<='5' ORDER BY c2 DESC
;SELECT * FROM t WHERE c1 = 5 AND c2>0 AND c2<='2' ORDER BY c2 ASC
;SELECT * FROM t WHERE c1 = 5 AND c2>0 AND c2<=5 ORDER BY c2 ASC
;SELECT * FROM t WHERE c1 = 5 AND c2>0 AND c2<='5' ORDER BY c2 ASC
;SELECT * FROM t WHERE c1 = 5 AND c2>'0' AND c2<=5 ORDER BY c2 ASC
;SELECT * FROM t WHERE c1 = 5 AND c2>'0' AND c2<='5' ORDER BY c2 ASC;