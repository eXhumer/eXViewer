// @ts-expect-error ignore types for initial and update for now
export const deepMerge = (initial, update) => {
  const copy = { ...initial };

  for (const key in update) {
    if (key in copy) {
      if (typeof copy[key] in ['function', 'symbol'])
        throw new Error('invalid value type!');

      else if (typeof copy[key] === 'object') {
        if (Array.isArray(copy[key])) {
          if (Array.isArray(update[key]))
            copy[key] = update[key];

          else {
            if (typeof update[key] !== 'object')
              throw new Error('data type change between initial and update!');

            for (const arrKey in update[key]) {
              if (parseInt(arrKey) < copy[key].length) {
                if (parseInt(arrKey) < 0)
                  throw new Error('invalid array key!');

                // @ts-expect-error ignore 'Element implicitly has an 'any' type because index expression is not of type 'number' for now
                copy[key][arrKey] = deepMerge(copy[key][arrKey], update[key][arrKey]);
              }

              else {
                // @ts-expect-error ignore 'Element implicitly has an 'any' type because index expression is not of type 'number' for now
                copy[key][arrKey] = update[key][arrKey];
              }
            }
            copy[key] = deepMerge(copy[key], update[key]);
          }
        }

        else {
          copy[key] = deepMerge(copy[key], update[key]);
        }
      }

      else
        copy[key] = update[key];
    }

    else
      copy[key] = update[key];
  }

  return copy;
};
