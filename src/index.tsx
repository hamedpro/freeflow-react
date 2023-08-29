import {
	Dispatch,
	ReactNode,
	SetStateAction,
	createContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cache, profile, profile_seed, transaction } from "freeflow-core/dist/UnifiedHandler_types";
import {
	calc_cache,
	calc_unresolved_cache,
	create_configured_axios,
	find_active_profile_seed,
	sync_cache,
	sync_profiles_seed,
	user_discoverable_transactions,
} from "freeflow-core/dist/utils";
import axios from "axios";
import { io } from "socket.io-client";
import { applyDiff } from "recursive-diff";
import { custom_find_unique } from "hamedpro-helpers";

var ws_endpoint: string = "http://localhost:5002";
var rest_endpoint: string = "http://localhost:5001";
var ui_endpoint: string = "http://localhost:5000";

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
};

var default_context_value: context_value = {
	configured_axios: axios.create(),
	transactions: [],
	cache: [],
	unresolved_cache: [],
	all_transactions: [],
	profiles: [],
	profiles_seed: [],
	set_state: () => {
		throw "context value is still its default value. valid set_state is not set here yet.";
	},
};

export const context = createContext<context_value>(default_context_value);
export function FreeFlowReact({ children }: { children: ReactNode }) {
	var [state, set_state] = useState<state_value>(default_context_value);

	var configured_axios = useMemo(() => {
		return create_configured_axios({
			restful_api_endpoint: rest_endpoint,
			jwt: find_active_profile_seed(state.profiles_seed)?.jwt,
		});
	}, [rest_endpoint, JSON.stringify(state.profiles_seed)]);
	var transactions = useMemo(
		() => user_discoverable_transactions(state.profiles, state.all_transactions),
		[JSON.stringify(state.profiles), JSON.stringify(state.all_transactions)]
	);
	var cache = useMemo(() => {
		return calc_cache(transactions, undefined);
	}, [JSON.stringify(transactions)]);
	var unresolved_cache = useMemo(() => {
		return calc_unresolved_cache(transactions, undefined);
	}, [JSON.stringify(transactions)]);
	var context_value: context_value = {
		...state,
		configured_axios,
		unresolved_cache,
		cache,
		transactions,
		set_state,
	};
	var websocket = useRef<ReturnType<typeof io>>();
	useEffect(() => {
		websocket.current = io(ws_endpoint);
		websocket.current.on("sync_profiles", (diff: rdiff.rdiffResult[]) => {
			set_state((prev) => {
				var profiles_clone = [...state.profiles];
				applyDiff(profiles_clone, diff);
				return {
					...prev,
					profiles: profiles_clone,
				};
			});
		});
		websocket.current.on("sync_all_transactions", (new_transactions: transaction[]) => {
			set_state((prev) => ({
				...prev,
				all_transactions: custom_find_unique(
					prev.all_transactions.concat(new_transactions),
					(tr1: transaction, tr2: transaction) => tr1.id === tr2.id
				),
			}));
		});
		sync_cache(websocket.current, state.all_transactions).then(
			() => {
				if (websocket.current === undefined) {
					throw `internal error! we were sure websocket_client is not undefined,
					but if you see this we were wrong.`;
				}
				sync_profiles_seed(websocket.current, state.profiles_seed);
			},
			(error) => {
				"async funcrtion failed : sync_cache";
			}
		);
	}, []);
	useEffect(() => {
		if (websocket.current === undefined) {
			throw `internal error! we were sure websocket_client is not undefined,
			but if you see this we were wrong.`;
		}
		sync_profiles_seed(websocket.current, state.profiles_seed);
	}, [JSON.stringify(state.profiles_seed)]);
	return <context.Provider value={context_value}>{children}</context.Provider>;
}
