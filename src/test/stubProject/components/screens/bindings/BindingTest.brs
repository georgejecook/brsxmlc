'@Import FocusMixin
'@Import BindingTestVM

function Init() as void
    m.log.I("Init")
    m.vm = BindingTestVM()
    m.screenStack = createObject("roArray", 0, true)
    m.top.topScreen = invalid
end function