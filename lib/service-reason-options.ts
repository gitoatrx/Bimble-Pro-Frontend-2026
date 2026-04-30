export type ServiceReasonSource = {
  service_id: number;
  service_code: string;
  service_name: string;
  description?: string | null;
  is_active?: boolean;
  problem_key?: string | null;
  display_reasons?: Array<{
    reason_key: string;
    reason_label: string;
  }>;
};

export type ServiceReasonOption<TService extends ServiceReasonSource = ServiceReasonSource> = {
  value: string;
  service: TService;
  service_id: number;
  label: string;
  reason_key: string;
  searchableText: string;
};

export function serviceReasonOptionsFromServices<TService extends ServiceReasonSource>(
  services: TService[],
): ServiceReasonOption<TService>[] {
  return services
    .filter((service) => service.is_active !== false)
    .flatMap((service) => {
      const reasons = service.display_reasons?.length
        ? service.display_reasons
        : [
            {
              reason_key: service.problem_key ?? service.service_code,
              reason_label: service.service_name,
            },
          ];

      return reasons.map((reason) => ({
        value: `${service.service_id}:${reason.reason_key}`,
        service,
        service_id: service.service_id,
        label: reason.reason_label,
        reason_key: reason.reason_key,
        searchableText: [
          reason.reason_label,
          reason.reason_key,
          service.service_name,
          service.service_code,
          service.description ?? "",
        ]
          .join(" ")
          .toLowerCase(),
      }));
    });
}
