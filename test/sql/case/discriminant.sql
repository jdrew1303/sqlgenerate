SELECT
  COUNT(*) AS VV_COUNT,
  (
    case trim(F1.CCOUNTRY) when 'USA' then 'United Sates' else F1.CCOUNTRY end
  ) AS COUNTRY
FROM
  DEMOCMAST AS F1
GROUP BY
  (
    case trim(F1.CCOUNTRY) when 'USA' then 'United Sates' else F1.CCOUNTRY end
  )
ORDER BY
  VV_COUNT DESC