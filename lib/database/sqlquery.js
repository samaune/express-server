export default SQL_QUERY = {

endpoint: 
`
;WITH tbl_list AS (
    SELECT SCHEMA_NAME(schema_id) [schema_name]
        ,t.[name] [table_name]
        ,REPLACE(t.[name], '_', '-') [route_name]
        ,'crud' [method]
        ,1 [anonymous]
        ,CASE WHEN c.[object_id] IS NULL THEN NULL ELSE '' + c.[name] + '' END [is_deleted]
    FROM [sys].[tables] t
    LEFT JOIN (
        SELECT [object_id], [name] FROM [sys].[all_columns] WHERE [name] IN ('DeletedOn', 'deleted_dt')
    ) c ON c.[object_id] = t.[object_id]
)
-- Replica by HTTP Request Method
SELECT ('[' + [schema_name] +'].[' + [table_name] + ']') [object_name]
    ,CONCAT(
        CASE WHEN [schema_name] = 'dbo' THEN [route_name] ELSE LOWER([schema_name] + '-' + [route_name]) END 
        ,
        CASE WHEN m.[value] IN ('GET', 'POST') THEN '' ELSE '/:id' END
    ) [endpoint]
    ,REPLACE(m.[value], 'GET_BY_ID', 'GET') [method]
    ,[anonymous]
    ,CASE WHEN m.[value] IN ('GET_BY_ID') THEN 1 ELSE 0 END [single]
    ,[is_deleted]
FROM tbl_list t, string_split('GET|GET_BY_ID|POST|PUT|DELETE', '|') m
`
}