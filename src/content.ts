export type Path = string[];

export interface IContentRow {
    path: Path;
}

export interface IContent<T extends IContentRow> {
    children: IContent<T>[];
    expanded?: boolean;
    row: T;
}
