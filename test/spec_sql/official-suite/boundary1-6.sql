-- original: boundary1.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

SELECT a FROM t1 WHERE rowid <= -8388608 ORDER BY a
;SELECT a FROM t1 WHERE rowid <= -8388608 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid <= -8388608 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid <= -8388608 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid <= -8388608 ORDER BY x
;SELECT * FROM t1 WHERE rowid=549755813888
;SELECT rowid, a FROM t1 WHERE x='0000008000000000'
;SELECT rowid, x FROM t1 WHERE a=35
;SELECT a FROM t1 WHERE rowid > 549755813888 ORDER BY a
;SELECT a FROM t1 WHERE rowid > 549755813888 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid > 549755813888 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid > 549755813888 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid > 549755813888 ORDER BY x
;SELECT a FROM t1 WHERE rowid >= 549755813888 ORDER BY a
;SELECT a FROM t1 WHERE rowid >= 549755813888 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid >= 549755813888 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid >= 549755813888 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid >= 549755813888 ORDER BY x
;SELECT a FROM t1 WHERE rowid < 549755813888 ORDER BY a
;SELECT a FROM t1 WHERE rowid < 549755813888 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid < 549755813888 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid < 549755813888 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid < 549755813888 ORDER BY x
;SELECT a FROM t1 WHERE rowid <= 549755813888 ORDER BY a
;SELECT a FROM t1 WHERE rowid <= 549755813888 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid <= 549755813888 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid <= 549755813888 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid <= 549755813888 ORDER BY x
;SELECT * FROM t1 WHERE rowid=8388607
;SELECT rowid, a FROM t1 WHERE x='00000000007fffff'
;SELECT rowid, x FROM t1 WHERE a=18
;SELECT a FROM t1 WHERE rowid > 8388607 ORDER BY a
;SELECT a FROM t1 WHERE rowid > 8388607 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid > 8388607 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid > 8388607 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid > 8388607 ORDER BY x
;SELECT a FROM t1 WHERE rowid >= 8388607 ORDER BY a
;SELECT a FROM t1 WHERE rowid >= 8388607 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid >= 8388607 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid >= 8388607 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid >= 8388607 ORDER BY x
;SELECT a FROM t1 WHERE rowid < 8388607 ORDER BY a
;SELECT a FROM t1 WHERE rowid < 8388607 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid < 8388607 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid < 8388607 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid < 8388607 ORDER BY x
;SELECT a FROM t1 WHERE rowid <= 8388607 ORDER BY a
;SELECT a FROM t1 WHERE rowid <= 8388607 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid <= 8388607 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid <= 8388607 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid <= 8388607 ORDER BY x
;SELECT * FROM t1 WHERE rowid=-3
;SELECT rowid, a FROM t1 WHERE x='fffffffffffffffd'
;SELECT rowid, x FROM t1 WHERE a=52
;SELECT a FROM t1 WHERE rowid > -3 ORDER BY a
;SELECT a FROM t1 WHERE rowid > -3 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid > -3 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid > -3 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid > -3 ORDER BY x
;SELECT a FROM t1 WHERE rowid >= -3 ORDER BY a
;SELECT a FROM t1 WHERE rowid >= -3 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid >= -3 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid >= -3 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid >= -3 ORDER BY x
;SELECT a FROM t1 WHERE rowid < -3 ORDER BY a
;SELECT a FROM t1 WHERE rowid < -3 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid < -3 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid < -3 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid < -3 ORDER BY x
;SELECT a FROM t1 WHERE rowid <= -3 ORDER BY a
;SELECT a FROM t1 WHERE rowid <= -3 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid <= -3 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid <= -3 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid <= -3 ORDER BY x
;SELECT * FROM t1 WHERE rowid=0
;SELECT rowid, a FROM t1 WHERE x='0000000000000000'
;SELECT rowid, x FROM t1 WHERE a=59
;SELECT a FROM t1 WHERE rowid > 0 ORDER BY a
;SELECT a FROM t1 WHERE rowid > 0 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid > 0 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid > 0 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid > 0 ORDER BY x
;SELECT a FROM t1 WHERE rowid >= 0 ORDER BY a
;SELECT a FROM t1 WHERE rowid >= 0 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid >= 0 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid >= 0 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid >= 0 ORDER BY x
;SELECT a FROM t1 WHERE rowid < 0 ORDER BY a
;SELECT a FROM t1 WHERE rowid < 0 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid < 0 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid < 0 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid < 0 ORDER BY x
;SELECT a FROM t1 WHERE rowid <= 0 ORDER BY a
;SELECT a FROM t1 WHERE rowid <= 0 ORDER BY a DESC
;SELECT a FROM t1 WHERE rowid <= 0 ORDER BY rowid
;SELECT a FROM t1 WHERE rowid <= 0 ORDER BY rowid DESC
;SELECT a FROM t1 WHERE rowid <= 0 ORDER BY x
;SELECT * FROM t1 WHERE rowid=-1
;SELECT rowid, a FROM t1 WHERE x='ffffffffffffffff'
;SELECT rowid, x FROM t1 WHERE a=38;