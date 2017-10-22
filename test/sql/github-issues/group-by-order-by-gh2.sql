SELECT STATE, LSTNAM, INIT, CUSNUM, BALDUE, ' '  
  FROM QCUSTCDT1                               
UNION 
SELECT STATE, ' ', ' ', 0, SUM(BALDUE), '*'
  FROM QCUSTCDT2                               
 GROUP BY JOHNNY                                   
UNION 
SELECT 'ZZ', ' ', ' ', 0, SUM(BALDUE), '**'
FROM QCUSTCDT3                               
ORDER BY 1,6