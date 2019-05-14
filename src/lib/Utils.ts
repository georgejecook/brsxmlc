export function spliceString(str: string, index: number, count: number, add: string): string {
  // We cannot pass negative indexes directly to the 2nd slicing operation.
  if (index < 0) {
    index = str.length + index;
    if (index < 0) {
      index = 0;
    }
  }

  return str.slice(0, index) + (add || '') + str.slice(index + count);
}

export function getRegexMatchesValues(input, regex, groupIndex): any[] {
  let values = [];
  let matches: any[];
  while (matches = regex.exec(input)) {
    values.push(matches[groupIndex]);
  }
  return values;
}

export function addSetItems(setA, setB) {
  for (const elem of setB) {
    setA.add(elem);
  }
}
