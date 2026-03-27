import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { clearAxiosAuthInterceptor, setupAxiosAuthInterceptor } from "../lib/axios";

export const useAxiosAuth = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    setupAxiosAuthInterceptor(getToken);

    return () => {
      clearAxiosAuthInterceptor();
    };
  }, [getToken]);
};