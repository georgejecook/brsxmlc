'@Namespace CyclicalImport3
'@Import "testCyclicalImport.brs"

function Init() as void
    m.log.I("Init")
    m.screenStack = createObject("roArray", 0, true)
    m.top.topScreen = invalid
end function