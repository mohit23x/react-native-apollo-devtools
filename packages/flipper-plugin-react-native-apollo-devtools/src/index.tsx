import React, { Dispatch, memo, SetStateAction, useState } from "react";
import {
  PluginClient,
  usePlugin,
  createState,
  useValue,
  Layout,
  DataInspector,
  DetailSidebar,
} from "flipper-plugin";
import { Button, Tabs, Typography, Tooltip, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import {
  ArrayOfMutations,
  ArrayOfQuery,
} from "react-native-apollo-devtools-client/src/typings";

const InitialData = {
  id: "x",
  lastUpdateAt: new Date(),
  queries: [],
  mutations: [],
  cache: [],
};
type Data = {
  id: string;
  lastUpdateAt: Date;
  queries: Array<any>;
  mutations: Array<any>;
  cache: object;
};

type Events = {
  "GQL:response": Data;
  "GQL:request": Data;
  "GQL:ack": boolean;
};

function createQueryBlocks(queries: ArrayOfQuery) {
  return queries.map((query) => {
    return {
      id: query?.id,
      name: query?.name,
      operationType: "Query",
      blocks: [
        // {
        //   blockType: "GQLString",
        //   blockLabel: "Query String",
        //   blockValue: query.queryString,
        // },
        {
          blockType: "Object",
          blockLabel: "Query Variables",
          blockValue: query?.variables,
        },
        {
          blockType: "Object",
          blockLabel: "Cached Response",
          blockValue: query?.cachedData,
        },
      ],
    };
  });
}

function createCacheBlock(cacheObject: object) {
  return [...Object.keys(cacheObject || {})].map((c) => {
    // @ts-expect-error
    const cache = cacheObject[c];

    return {
      id: cache?.id || cache.__typename,
      name: c,
      operationType: "Cache",
      blocks: [
        {
          blockType: "Object",
          blockLabel: "Cached Data",
          blockValue: cache,
        },
      ],
    };
  });
}

function createMutationBlocks(mutations: ArrayOfMutations) {
  return mutations.map((mutation) => {
    /*
      TODO: mutation.loading
      TODO: cached response (options not applicable in apollo 3.5+)
    */
    return {
      id: mutation?.id,
      name: mutation.name,
      operationType: "Mutation",
      blocks: [
        {
          blockType: "GQLString",
          blockLabel: "Mutation Query String",
          blockValue: mutation.body,
        },
        {
          blockType: "Object",
          blockLabel: "Query Variables",
          blockValue: mutation.variables,
        },
      ],
    };
  });
}

export function plugin(client: PluginClient<Events, {}>) {
  const data = createState<Data>(InitialData, { persist: "data" });

  client.onMessage("GQL:response", (newData) => {
    client.writeTextToClipboard(`${newData?.id}`);
    const finalData = {
      ...newData,
      mutations: createMutationBlocks(newData?.mutations).reverse(),
      queries: createQueryBlocks(newData?.queries).reverse(),
      cache: createCacheBlock(newData?.cache),
    };

    data.set(finalData);
    client.send("GQL:ack", {});
  });

  client.addMenuEntry({
    action: "clear",
    handler: async () => {
      data.set(InitialData);
    },
  });

  client.addMenuEntry({
    label: "refresh",
    handler: async () => {
      // @ts-expect-error string is not assignable to never
      client.send("GQL:request", {});
    },
  });

  function onCopyText(text: string) {
    client.writeTextToClipboard(text);
    message.success("Text copied to clipboard");
  }

  return { data, onCopyText };
}

const TabEnums = {
  query: { key: "query", value: "Query", plural: "Queries" },
  mutation: { key: "mutation", value: "Mutation", plural: "Mutations" },
  cache: { key: "cache", value: "Cache", plural: "Mutations" },
};

const TabItem = memo(
  ({
    active,
    setInspectorObject,
    data,
  }: {
    active: boolean;
    setInspectorObject: Dispatch<SetStateAction<{}>>;
    data: any;
  }) => {
    return (
      <Button
        onClick={() => {
          setInspectorObject(data);
        }}
        type={active ? "primary" : "text"}
        block
        style={{ textAlign: "left", margin: "5px 0" }}
      >
        {data?.name || "-"}
      </Button>
    );
  },
);

const { TabPane } = Tabs;

export function Component() {
  const instance = usePlugin(plugin);
  const data = useValue(instance.data);
  const [activeTab, setActiveTab] = useState(TabEnums.query.key);
  const [inspectorObject, setInspectorObject] = useState({});

  return (
    <>
      <Typography.Title level={4}>
        Last update at:
        {`${data?.lastUpdateAt?.toString()}`} - {data?.id || "-"}
      </Typography.Title>
      <Layout.ScrollContainer>
        <Tabs defaultActiveKey="1" onChange={setActiveTab}>
          <TabPane tab={TabEnums.query.value} key={TabEnums.query.key}>
            {data?.queries?.map((d) => {
              const active =
                activeTab === TabEnums.query.key &&
                inspectorObject?.id === d?.id;

              return (
                <TabItem
                  key={`query${d?.id}`}
                  active={active}
                  setInspectorObject={setInspectorObject}
                  data={d}
                />
              );
            })}
          </TabPane>
          <TabPane tab={TabEnums.mutation.value} key={TabEnums.mutation.key}>
            {data?.mutations?.map((d) => {
              const active =
                activeTab === TabEnums.mutation.key &&
                inspectorObject?.id === d?.id;

              return (
                <TabItem
                  key={`mutation${d?.id}`}
                  active={active}
                  setInspectorObject={setInspectorObject}
                  data={d}
                />
              );
            })}
          </TabPane>
          <TabPane tab={TabEnums.cache.key} key={TabEnums.cache.key}>
            {data?.cache?.map((d) => {
              const active =
                activeTab === TabEnums.cache.key &&
                inspectorObject?.id === d?.id;

              return (
                <TabItem
                  key={`cache${d?.id}`}
                  active={active}
                  setInspectorObject={setInspectorObject}
                  data={d}
                />
              );
            })}
          </TabPane>
        </Tabs>
      </Layout.ScrollContainer>
      <DetailSidebar width={550}>
        <Layout.Container gap pad>
          <Typography.Title level={4} type="secondary">
            {inspectorObject?.operationType}
          </Typography.Title>
          <Typography.Title level={4}>{inspectorObject?.name}</Typography.Title>
          <br />

          {inspectorObject?.blocks?.map((block, index) => {
            const key = `block${index}`;

            if (block.blockType === "GQLString") {
              return (
                <>
                  <Typography.Title key={key} level={4} type="secondary">
                    {block?.blockLabel}
                  </Typography.Title>
                  <Typography.Text style={{ fontSize: 12 }}>
                    <pre>{block?.blockValue?.trim()}</pre>
                  </Typography.Text>
                  <br />
                </>
              );
            } else if (block.blockType === "Object") {
              return (
                <>
                  <Typography.Title key={key} level={4} type="secondary">
                    {block?.blockLabel}
                    <Tooltip title="copy">
                      <Button
                        onClick={() =>
                          instance.onCopyText(
                            `${JSON.stringify(block?.blockValue)}`,
                          )
                        }
                        style={{ marginLeft: 10 }}
                        size="small"
                        type="default"
                        shape="default"
                        icon={<CopyOutlined />}
                      />
                    </Tooltip>
                  </Typography.Title>
                  <DataInspector data={block?.blockValue} expandRoot={true} />
                  <br />
                </>
              );
            } else {
              return null;
            }
          })}
        </Layout.Container>
      </DetailSidebar>
    </>
  );
}
