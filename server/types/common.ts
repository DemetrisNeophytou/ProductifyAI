export type ID = string & { readonly brand: unique symbol };
export type IsoDateString = string & { readonly iso: true };

export interface PageParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
}

export interface SearchProjectsParams extends PageParams {
  userId: string;
  query?: string;
  type?: string;
  tag?: string;
  from?: string;
  to?: string;
  status?: string;
  starred?: boolean;
}




