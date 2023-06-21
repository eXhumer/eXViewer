/*
  eXViewer - Live timing and content streaming client for F1TV
  Copyright © 2023 eXhumer

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

export const deepMerge = (initial: unknown, update: unknown) => {
  for (const key in (update as Record<string, unknown>)) {
    if (key in (initial as Record<string, unknown>)) {
      if (typeof (initial as Record<string, unknown>)[key] in ["function", "symbol"])
        throw new Error("invalid value type!");

      else if (typeof (initial as Record<string, unknown>)[key] === "object") {
        if (Array.isArray((initial as Record<string, unknown>)[key])) {
          if (Array.isArray((update as Record<string, unknown>)[key]))
            (initial as Record<string, unknown>)[key] = (update as Record<string, unknown>)[key];

          else {
            if (typeof (update as Record<string, unknown>)[key] !== "object")
              throw new Error("data type change between initial and update!");

            for (const arrKey in ((update as Record<string, Record<string, unknown>>)[key])) {
              if (parseInt(arrKey) <
                  ((initial as Record<string, unknown>)[key] as unknown[]).length) {
                if (parseInt(arrKey) < 0)
                  throw new Error("invalid array key!");

                (initial as Record<string, Record<string, unknown>>)[key][arrKey] =
                  deepMerge((initial as Record<string, Record<string, unknown>>)[key][arrKey],
                            (update as Record<string, Record<string, unknown>>)[key][arrKey]);
              }

              else
                (initial as Record<string, Record<string, unknown>>)[key][arrKey] = 
                  (update as Record<string, Record<string, unknown>>)[key][arrKey];
            }
            (initial as Record<string, unknown>)[key] = deepMerge(
              (initial as Record<string, unknown>)[key],
              (update  as Record<string, unknown>)[key]);
          }
        }

        else {
          (initial as Record<string, unknown>)[key] = deepMerge(
            (initial as Record<string, unknown>)[key],
            (update as Record<string, unknown>)[key]);
        }
      }

      else
        (initial as Record<string, unknown>)[key] = (update as Record<string, unknown>)[key];
    } else
      (initial as Record<string, unknown>)[key] = (update as Record<string, unknown>)[key];
  }

  return initial;
};
