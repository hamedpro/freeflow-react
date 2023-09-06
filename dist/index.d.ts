import { Dispatch, ReactNode, SetStateAction } from "react";
import { cache, profile, profile_seed, transaction } from "freeflow-core/dist/UnifiedHandler_types";
import { create_configured_axios, request_new_transaction, request_new_thing } from "freeflow-core/dist/utils";
export type state_value = {
    all_transactions: transaction[];
    profiles_seed: profile_seed[];
    profiles: profile[];
};
export type context_value = state_value & {
    configured_axios: ReturnType<typeof create_configured_axios>;
    transactions: transaction[];
    cache: cache;
    unresolved_cache: cache;
    set_state: Dispatch<SetStateAction<state_value>>;
    request_new_transaction: typeof request_new_transaction;
    request_new_thing: typeof request_new_thing;
    ws_endpoint: string;
    rest_endpoint: string;
    calc_file_url: (file_id: number) => string;
};
export declare const context: import("react").Context<context_value>;
export declare function FreeFlowReact({ children, ws_endpoint, rest_endpoint, }: {
    children: ReactNode;
    ws_endpoint: string;
    rest_endpoint: string;
}): import("react/jsx-runtime").JSX.Element;
