import { FormEvent, useEffect, useRef, useState } from "react";
import { DataTable, DataTableSelectAllChangeEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Tart } from "./types";

function App() {
  const op = useRef<OverlayPanel>(null);

  const [art, setArt] = useState<Tart[]>([]);
  const [selectedArts, setSelectedArts] = useState<Tart[]>([]);
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(1);
  const [page, setPage] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const selectedCount = selectedArts.filter(({ id: itm }) =>
      art.some(({ id: itm2 }) => itm === itm2)
    ).length;
    const totalArtCount = art.length;

    if (selectedCount === totalArtCount) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedArts, art, page]);

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.artic.edu/api/v1/artworks?page=${page + 1}`)
      .then((res) => res.json())
      .then((data) => {
        setArt(data.data);
      })
      .then(() => {
        setLoading(false);
      });
  }, [page]);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setPage(event.page);
    setFirst(event.first);
  };

  const onSelectAllChange = (e: DataTableSelectAllChangeEvent) => {

    if (e.checked) {
      setSelectedArts((selectedArts) => [
        ...selectedArts,
        ...art.filter(
          ({ id: itm }) => !selectedArts.some(({ id: itm2 }) => itm === itm2)
        ),
      ]);
      setSelectAll(true);
    } else {
      setSelectedArts((selectedArts) =>
        selectedArts.filter(
          ({ id: itm1 }) => !art.some(({ id: itm2 }) => itm1 === itm2)
        )
      );
      setSelectAll(false);
    }
  };

  async function onClick(e: FormEvent) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;

    // Accessing the first input element (assuming it's an input field)
    if (form && form.elements[0] instanceof HTMLInputElement) {
      const noOfSelections = Number(form.elements[0].value);
      
      // Handle case where noOfSelections is less than 13
      if (noOfSelections < 13) {
        setSelectedArts((selectedArts) => [
          ...selectedArts,
          ...art
            .slice(0, noOfSelections)
            .filter(({ id: itm1 }) =>
              !selectedArts.some(({ id: itm2 }) => itm1 === itm2)
            ),
        ]);
      } else {
        // Fetch additional data if noOfSelections >= 13
        const endArrayToAdd: Tart[] = [];
        const noOfApiCalls = Math.ceil(noOfSelections / 12);
        
        // Wait for all fetch calls to complete
        for (let x = 1; x <= noOfApiCalls; x++) {
          const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page + x}`);
          const data = await response.json();
          endArrayToAdd.push(...data.data);  // Spread the data to push individual items
        }

        // Update selected arts with fetched data
        setSelectedArts((selectedArts) => [
          ...selectedArts,
          ...endArrayToAdd.slice(0,noOfSelections).filter(({ id: itm1 }) =>
            !selectedArts.some(({ id: itm2 }) => itm1 === itm2)
          ),
        ]);

      }

    }

    setValue("");  // Reset the input field
    op.current?.toggle(e);  // Toggle something (assumed UI interaction)
}
  return (
    <>
      <DataTable
        value={art}
        selectionMode={"checkbox"}
        rows={12}
        loading={loading}
        selection={selectedArts}
        onSelectAllChange={onSelectAllChange}
        selectAll={selectAll}
        onSelectionChange={(e) => {
          setSelectedArts(e.value);
          if (e.value.length == 12) {
            setSelectAll(true);
          } else {
            setSelectAll(false);
          }
        }}
        dataKey="id"
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
        ></Column>
        <Column
          header={
            <div className="card flex justify-content-center">
              <Button
                unstyled={true}
                icon="pi pi-chevron-down"
                style={{
                  height: "32px",
                  width: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={(e) => op.current?.toggle(e)}
              />
              <OverlayPanel ref={op}>
                <form onSubmit={onClick}>
                  <div style={{ marginTop: "1rem" }}>
                    <FloatLabel>
                      <InputText
                        id="selectrows"
                        value={value}
                        min={1}
                        type="number"
                        onChange={(e) => setValue(e.target.value)}
                      />
                      <label htmlFor="selectrows">Select rows...</label>
                    </FloatLabel>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "end",
                        alignItems: "center",
                        marginTop: "1rem",
                      }}
                    >
                      <Button type="submit" style={{ padding: "0.5rem 1rem" }}>
                        submit
                      </Button>
                    </div>
                  </div>
                </form>
              </OverlayPanel>
            </div>
          }
        ></Column>
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place of Origin"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start Date"></Column>
        <Column field="date_end" header="End Date"></Column>
      </DataTable>
      <Paginator
        first={first}
        rows={12}
        totalRecords={120}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default App;
