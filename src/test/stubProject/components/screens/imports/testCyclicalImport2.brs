'@Namespace CyclicalImport2
'@Import CyclicalImport3

function Init() as void
    m.log.I("Init")
    m.screenStack = createObject("roArray", 0, true)
    m.top.topScreen = invalid
end function