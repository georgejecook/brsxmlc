export class ProcessorSettings {
  public importRegex = new RegExp(`'@Import\\s*\\"(.*)\\"`, `gi`);
  public namespaceRegex = new RegExp(`('@Namespace) *(\\w*) *(\\w*)`, `i`);
  public importXMLRegex = new RegExp(`<.*?script.*uri=\\"(.*)\\".*\\/?>"`, `gi`);
  public importTemplate = `<script type="text/brightscript" uri="$PATH$" />`;
  public observeRegex = new RegExp(`"{`, `g`);
  public bindingRegex = new RegExp(`"{`, `g`);
  public bindingObserverRegex = new RegExp(`"{`, `g`);
  public endOfXmlFileRegex = new RegExp(`</component>`, `gim`);
  public functionNameRegex = new RegExp('^((?: |\\t)*(?:function|sub)\\s*)([0-9a-z_]*)', 'gim');
}
