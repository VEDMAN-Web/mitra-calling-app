// swagger-jsdoc has no per-spec way to scope shared route files (e.g. auth.routes.ts)
// to specific operations, so specs that share a file filter the generated paths by tag.
export function keepTag(spec: any, tags: string | string[]) {
  const tagList = Array.isArray(tags) ? tags : [tags];
  for (const [path, methods] of Object.entries<any>(spec.paths)) {
    for (const method of Object.keys(methods)) {
      if (!methods[method].tags?.some((t: string) => tagList.includes(t))) delete methods[method];
    }
    if (Object.keys(methods).length === 0) delete spec.paths[path];
  }
  return spec;
}

export function dropTag(spec: any, tag: string) {
  for (const [path, methods] of Object.entries<any>(spec.paths)) {
    for (const method of Object.keys(methods)) {
      if (methods[method].tags?.includes(tag)) delete methods[method];
    }
    if (Object.keys(methods).length === 0) delete spec.paths[path];
  }
  return spec;
}
