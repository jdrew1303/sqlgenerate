-- original: tkt2141.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

CREATE TABLE tab1 (t1_id integer PRIMARY KEY, t1_desc);
      INSERT INTO tab1 VALUES(1,'rec 1 tab 1');
      CREATE TABLE tab2 (t2_id integer PRIMARY KEY, t2_id_t1, t2_desc);
      INSERT INTO tab2 VALUES(1,1,'rec 1 tab 2');
      CREATE TABLE tab3 (t3_id integer PRIMARY KEY, t3_id_t2, t3_desc);
      INSERT INTO tab3 VALUES(1,1,'aa');
      SELECT *
      FROM tab1 t1 LEFT JOIN tab2 t2 ON t1.t1_id = t2.t2_id_t1
      WHERE t2.t2_id IN
           (SELECT t2_id FROM tab2, tab3 ON t2_id = t3_id_t2
             WHERE t3_id IN (1,2) GROUP BY t2_id)
;SELECT *
      FROM tab1 t1 LEFT JOIN tab2 t2 ON t1.t1_id = t2.t2_id_t1
      WHERE t2.t2_id IN
           (SELECT t2_id FROM tab2, tab3 ON t2_id = t3_id_t2
             WHERE t3_id IN (1,2))
;SELECT *
      FROM tab1 t1 LEFT JOIN tab2 t2
      WHERE t2.t2_id IN
           (SELECT t2_id FROM tab2, tab3 ON t2_id = t3_id_t2
             WHERE t3_id IN (1,2));