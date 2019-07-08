'@Namespace CyclicalImport2
'@Import "testCyclicalImport3.brs"

function Init() as void
    m.log.I("Init")
    m.screenStack = createObject("roArray", 0, true)
    m.top.topScreen = invalid
end function