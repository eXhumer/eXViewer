// @ts-expect-error ignore types for initial and update for now
export const deepMerge = (initial, update) => {
  for (const key in update) {
    if (key in initial) {
      if (typeof initial[key] in ['function', 'symbol'])
        throw new Error('invalid value type!');

      else if (typeof initial[key] === 'object') {
        if (Array.isArray(initial[key])) {
          if (Array.isArray(update[key]))
            initial[key] = update[key];

          else {
            if (typeof update[key] !== 'object')
              throw new Error('data type change between initial and update!');

            for (const arrKey in update[key]) {
              if (parseInt(arrKey) < initial[key].length) {
                if (parseInt(arrKey) < 0)
                  throw new Error('invalid array key!');

                // @ts-expect-error ignore 'Element implicitly has an 'any' type because index expression is not of type 'number' for now
                initial[key][arrKey] = deepMerge(initial[key][arrKey], update[key][arrKey]);
              }

              else {
                // @ts-expect-error ignore 'Element implicitly has an 'any' type because index expression is not of type 'number' for now
                initial[key][arrKey] = update[key][arrKey];
              }
            }
            initial[key] = deepMerge(initial[key], update[key]);
          }
        }

        else {
          initial[key] = deepMerge(initial[key], update[key]);
        }
      }

      else
        initial[key] = update[key];
    }

    else
      initial[key] = update[key];
  }

  return initial;
};
