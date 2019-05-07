export class ProcessorSettings {
  public importRegex = new RegExp(`('@Import )(\\w*)`, `g`);
  public namespaceRegex = new RegExp(`('@Namepsace )(\\w*)`, `g`);
  public importXMLRegex = new RegExp(`<script(.|\n)*type=\`text\\/brightscript\`(.|\\n)*uri=\`pkg:\\/(.*)\`(.|\\n)/>`, `g`);
  public importTemplate = `<script type="text/brightscript" uri="$PATH$" />`;
  public observeRegex = new RegExp(`"{`, `g`);
  public bindingRegex = new RegExp(`"{`, `g`);
  public bindingObserverRegex = new RegExp(`"{`, `g`);
}
