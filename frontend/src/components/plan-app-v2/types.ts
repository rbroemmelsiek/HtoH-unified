
export type PlanRowType = 'root' | 'panel' | 'checkbox' | 'text' | 'link' | 'comment';

export interface PlanRow {
  eid: string;
  pid: string;
  pos: number;
  type: PlanRowType;

  name: string;
  tooltip: string;
  link: string;
  date: string | null;
  new_window: boolean;

  visible: boolean;
  opened: boolean;
  edit: boolean;
  checked: number; // 0=NEW, 1=GREEN, 2=YELLOW, 3=RED, 4=DONE

  video: string;
  video_script: string;
  owner: number;

  children: PlanRow[];
  isNew?: boolean;
}

export interface PlanDocument {
  name: string;
  root: {
    children: PlanRow[];
  };
}

export type AddChildType = 'panel' | 'checkbox' | 'text' | 'link' | 'comment';

export type MesopType = 'SectionHeader' | 'Name' | 'Email' | 'Phone' | 'Address' | 'PageBreak' | 'Price' | 'Percent' | 'Number' | 'Decimal' | 'ChangeCounter' | 'Progress' | 'Date' | 'Time' | 'DateTime' | 'Duration' | 'ChangeTimestamp' | 'Text' | 'LongText' | 'Image' | 'File' | 'Video' | 'Signature' | 'Drawing' | 'Yes/No' | 'Enum' | 'EnumList' | 'Ref' | 'Color' | 'Url' | 'LatLong' | 'XY' | 'App' | 'Thumbnail' | 'ChangeLocation';

export interface FieldDef {
  name: string;
  label: string;
  type: MesopType;
  placeholder?: string;
  options?: string[];
  readOnly?: boolean;
  description?: string;
  hidden?: boolean;
}
