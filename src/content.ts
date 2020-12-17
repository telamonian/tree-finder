export type Path = string[];

export interface IContentRow {
    path: Path;
}

export interface IContent<T extends IContentRow> {
    children: IContent<T>[];
    row: T;

    _is_open: boolean;
}
