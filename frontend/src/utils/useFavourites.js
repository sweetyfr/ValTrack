import { useState } from "react";

const KEY = "valtrack_favourites";
const MAX = 8;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function useFavourites() {
  const [favourites, setFavourites] = useState(load);

  function persist(list) {
    setFavourites(list);
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function add(name, tag) {
    const current = load(); // read fresh so Profile + Home don't fight
    const deduped = current.filter(
      (f) => !(f.name.toLowerCase() === name.toLowerCase() && f.tag.toLowerCase() === tag.toLowerCase())
    );
    persist([{ name, tag, ts: Date.now() }, ...deduped].slice(0, MAX));
  }

  function remove(name, tag) {
    persist(
      load().filter(
        (f) => !(f.name.toLowerCase() === name.toLowerCase() && f.tag.toLowerCase() === tag.toLowerCase())
      )
    );
  }

  return { favourites, add, remove };
}
