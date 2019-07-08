'@Import "pkg:/source/mixins/TextMixin.brs"
'@Import "pkg:/source/mixins/FocusMixin.brs"
'@Import "pkg:/source/mixins/NetMixin.brs"
'@Import "pkg:/source/mixins/AuthMixin.brs"

function Init() as void
    m.log.I("Init")
    m.screenStack = createObject("roArray", 0, true)
    m.top.topScreen = invalid
end function