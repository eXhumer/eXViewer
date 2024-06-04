/*
  eXViewer - Unofficial live timing and content streaming client for F1TV
  Copyright (C) 2024  eXhumer

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

import { inflateRawSync } from "zlib";

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

export const decompressZlibData = (b64Encoded: string) => {
  const deflatedZlibData = Buffer.from(b64Encoded, "base64");
  const inflatedData = inflateRawSync(deflatedZlibData);
  return JSON.parse(inflatedData.toString("utf8"));
};

export const transcribeAudio = async (
  audioBlob: Blob,
  audioFileName: string,
  transcriberUrl: string = "http://127.0.0.1:8080/inference",
) => {
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    const formData = new FormData();
    formData.append("file", audioBlob, audioFileName);
    formData.append("response_type", "json");

    const res = await fetch(transcriberUrl, { method: "POST", body: formData });

    if (res.status !== 200)
      throw new Error(`Transcriber server returned status code ${res.status}`);

    const data = await res.json();

    if (data.text)
      return data.text as string;

    console.warn("Transcriber server returned empty response, retrying...");
  }

  throw new Error("Transcriber server didn't send any text for audio");
};
