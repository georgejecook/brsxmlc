'@Import TextMixin
'@Import FocusMixin
'@Import NetMixin
'@Import AuthMixin

function Init() as void
    m.log.I("Init")
    m.screenStack = createObject("roArray", 0, true)
    m.top.topScreen = invalid
end function